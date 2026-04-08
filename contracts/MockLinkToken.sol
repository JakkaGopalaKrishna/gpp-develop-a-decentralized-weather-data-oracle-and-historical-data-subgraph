// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IERC677Receiver {
    function onTokenTransfer(address sender, uint256 amount, bytes calldata data) external;
}

contract MockLinkToken is ERC20 {
    constructor() ERC20("Mock LINK", "LINK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 18;
    }

    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool) {
        _transfer(msg.sender, to, value);
        if (to.code.length > 0) {
            try IERC677Receiver(to).onTokenTransfer(msg.sender, value, data) {
                // ignore return value
            } catch {
                // ignore failures for mocks
            }
        }
        return true;
    }
}
