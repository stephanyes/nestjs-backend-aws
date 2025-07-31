export default class ApplicationDto {
  application_name = process.env.npm_package_name;
  application_version = process.env.npm_package_version;
}
