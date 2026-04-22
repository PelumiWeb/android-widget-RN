require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-android-widgets"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { :ios => "14.0" }
  s.source       = { :git => "https://github.com/PelumiWeb/react-native-android-widgets.git", :tag => "#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.dependency "React-Core"
end
