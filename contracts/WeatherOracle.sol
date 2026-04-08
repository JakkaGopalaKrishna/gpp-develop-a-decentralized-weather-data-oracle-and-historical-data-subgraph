// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/operatorforwarder/ChainlinkClient.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WeatherOracle is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    event WeatherRequested(bytes32 indexed requestId, string city, address indexed requester);
    event WeatherReported(bytes32 indexed requestId, string city, int256 temperature, string description, uint256 timestamp, address indexed requester);

    struct WeatherReport {
        string city;
        int256 temperature;
        string description;
        uint256 timestamp;
        address requester;
    }

    mapping(bytes32 => WeatherReport) public weatherReports;
    mapping(bytes32 => string) private pendingCity;
    mapping(bytes32 => address) private pendingRequester;

    address public chainlinkToken;
    address public oracle;
    bytes32 public jobId;
    uint256 public fee;

    constructor(address _link, address _oracle, bytes32 _jobId, uint256 _fee) {
        setChainlinkToken(_link);
        setChainlinkOracle(_oracle);
        jobId = _jobId;
        fee = _fee;
        chainlinkToken = _link;
        oracle = _oracle;
    }

    function requestWeather(string calldata _city) external returns (bytes32 requestId) {
        require(bytes(_city).length > 0, "City name required");
        require(chainlinkToken != address(0), "LINK token not configured");
        require(oracle != address(0), "Oracle not configured");
        require(jobId != bytes32(0), "Job ID not configured");
        require(LinkTokenInterface(chainlinkToken).balanceOf(address(this)) >= fee, "Insufficient LINK balance");

        Chainlink.Request memory request = _buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        Chainlink._add(request, "city", _city);
        Chainlink._add(request, "path", "data");
        Chainlink._add(request, "copyPath", "result");

        requestId = _sendChainlinkRequestTo(oracle, request, fee);
        pendingCity[requestId] = _city;
        pendingRequester[requestId] = msg.sender;
        emit WeatherRequested(requestId, _city, msg.sender);
    }

    function fulfill(bytes32 _requestId, string memory _weatherData) public recordChainlinkFulfillment(_requestId) {
        string memory city = pendingCity[_requestId];
        address requester = pendingRequester[_requestId];
        require(bytes(city).length > 0, "Unknown request city");
        require(requester != address(0), "Unknown request owner");

        (int256 temperature, string memory description) = parseWeatherData(_weatherData);
        weatherReports[_requestId] = WeatherReport({
            city: city,
            temperature: temperature,
            description: description,
            timestamp: block.timestamp,
            requester: requester
        });

        emit WeatherReported(_requestId, city, temperature, description, block.timestamp, requester);
        delete pendingCity[_requestId];
        delete pendingRequester[_requestId];
    }

    function parseWeatherData(string memory _weatherData) public pure returns (int256 temperature, string memory description) {
        bytes memory data = bytes(_weatherData);
        temperature = parseIntField(data, "temperature");
        description = parseStringField(data, "description");
    }

    function parseIntField(bytes memory data, string memory key) internal pure returns (int256) {
        bytes memory needle = abi.encodePacked(key, "\":");
        uint256 start = indexOf(data, needle);
        require(start < data.length, "Integer field not found");
        start += needle.length;

        bool negative = false;
        if (data[start] == "-") {
            negative = true;
            start++;
        }

        int256 value = 0;
        while (start < data.length && data[start] >= "0" && data[start] <= "9") {
            value = value * 10 + (int256(uint256(uint8(data[start]))) - 48);
            start++;
        }
        return negative ? -value : value;
    }

    function parseStringField(bytes memory data, string memory key) internal pure returns (string memory) {
        bytes memory needle = abi.encodePacked(key, "\":\"");
        uint256 start = indexOf(data, needle);
        require(start < data.length, "String field not found");
        start += needle.length;

        uint256 end = start;
        while (end < data.length && data[end] != '"') {
            end++;
        }

        bytes memory result = new bytes(end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = data[i];
        }
        return string(result);
    }

    function indexOf(bytes memory haystack, bytes memory needle) internal pure returns (uint256) {
        if (needle.length > haystack.length) {
            return type(uint256).max;
        }
        for (uint256 i = 0; i <= haystack.length - needle.length; i++) {
            bool found = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                return i;
            }
        }
        return type(uint256).max;
    }

    function setChainlinkOracle(address _oracle) public onlyOwner {
        oracle = _oracle;
        _setChainlinkOracle(_oracle);
    }

    function setChainlinkToken(address _link) public onlyOwner {
        chainlinkToken = _link;
        _setChainlinkToken(_link);
    }

    function setJobId(bytes32 _jobId) public onlyOwner {
        jobId = _jobId;
    }

    function setFee(uint256 _fee) public onlyOwner {
        fee = _fee;
    }

    function withdrawLink(address to, uint256 amount) external onlyOwner {
        require(LinkTokenInterface(chainlinkToken).transfer(to, amount), "LINK transfer failed");
    }

    receive() external payable {}
}
