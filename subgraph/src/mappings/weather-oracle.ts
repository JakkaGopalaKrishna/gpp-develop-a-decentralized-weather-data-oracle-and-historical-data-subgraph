import { WeatherReported } from "../../generated/WeatherOracle/WeatherOracle";
import { WeatherReport } from "../../generated/schema";

export function handleWeatherReported(event: WeatherReported): void {
  const id = event.params.requestId.toHexString();
  let report = WeatherReport.load(id);
  if (!report) {
    report = new WeatherReport(id);
  }

  report.city = event.params.city;
  report.temperature = event.params.temperature;
  report.description = event.params.description;
  report.timestamp = event.params.timestamp;
  report.requester = event.params.requester;
  report.save();
}
