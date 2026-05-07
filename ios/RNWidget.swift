import WidgetKit
import SwiftUI

// MARK: - Configuration (edit these values)
private let appGroupId = "group.com.yourapp.widget"  // must match AndroidWidgets.configureIOS()
private let widgetName = "my_widget"                 // must match registerWidget({ name: "my_widget" })

// MARK: - Mode
// "image"  — app-driven bitmap (default). Your React Native app pushes updates via WidgetCanvas.
// "clock"  — self-refreshing digital clock. No app involvement needed.
// "fetch"  — fetches dataURL on a schedule and displays the response. No app involvement needed.
private let widgetMode = "image"

// Clock mode settings (used when widgetMode == "clock")
private let clockFormat     = "h:mm a"   // DateFormatter pattern, e.g. "HH:mm", "h:mm:ss a"
private let clockFontSize   = CGFloat(48)
private let clockColor      = Color.white
private let clockBackground = Color(hex: "#1A1A2E")

// Fetch mode settings (used when widgetMode == "fetch")
// dataURL must return JSON: { "text": "...", "textColor": "#RRGGBB", "backgroundColor": "#RRGGBB" }
private let dataURL          = ""   // e.g. "https://api.example.com/widget-data"
private let fetchIntervalMin = 15   // minutes between background reloads

// MARK: - Entry

struct RNWidgetEntry: TimelineEntry {
    let date: Date
    let image: UIImage?
    let text: String?
    let textColor: Color
    let backgroundColor: Color
}

// MARK: - Provider

struct RNWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> RNWidgetEntry {
        RNWidgetEntry(date: Date(), image: nil, text: nil,
                      textColor: .primary, backgroundColor: Color(.systemBackground))
    }

    func getSnapshot(in context: Context, completion: @escaping (RNWidgetEntry) -> Void) {
        switch widgetMode {
        case "clock":
            completion(RNWidgetEntry(date: Date(), image: nil,
                                     text: formattedTime(Date()),
                                     textColor: clockColor,
                                     backgroundColor: clockBackground))
        case "fetch":
            completion(RNWidgetEntry(date: Date(), image: nil,
                                     text: "Loading…",
                                     textColor: .primary,
                                     backgroundColor: Color(.systemBackground)))
        default:
            completion(RNWidgetEntry(date: Date(), image: loadImage(),
                                     text: nil, textColor: .primary,
                                     backgroundColor: Color(.systemBackground)))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RNWidgetEntry>) -> Void) {
        switch widgetMode {
        case "clock":
            completion(buildClockTimeline())
        case "fetch" where !dataURL.isEmpty:
            fetchRemoteData(completion: completion)
        default:
            let entry = RNWidgetEntry(date: Date(), image: loadImage(),
                                      text: nil, textColor: .primary,
                                      backgroundColor: Color(.systemBackground))
            // .never — the app drives updates via AndroidWidgets.updateWidgetWithView()
            completion(Timeline(entries: [entry], policy: .never))
        }
    }

    // MARK: Clock timeline — one entry per minute for the next 60 minutes

    private func buildClockTimeline() -> Timeline<RNWidgetEntry> {
        let calendar = Calendar.current
        let now = Date()
        let entries = (0..<60).map { offset -> RNWidgetEntry in
            let d = calendar.date(byAdding: .minute, value: offset, to: now)!
            return RNWidgetEntry(date: d, image: nil,
                                  text: formattedTime(d),
                                  textColor: clockColor,
                                  backgroundColor: clockBackground)
        }
        // .atEnd reloads when the last entry is consumed (~60 min), keeping the clock running
        return Timeline(entries: entries, policy: .atEnd)
    }

    private func formattedTime(_ date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = clockFormat
        return f.string(from: date)
    }

    // MARK: Fetch timeline — network request, single entry, reload after fetchIntervalMin

    private func fetchRemoteData(completion: @escaping (Timeline<RNWidgetEntry>) -> Void) {
        guard let url = URL(string: dataURL) else { return }
        URLSession.shared.dataTask(with: url) { data, _, _ in
            let entry: RNWidgetEntry
            if let data = data,
               let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                entry = RNWidgetEntry(
                    date: Date(),
                    image: nil,
                    text: json["text"] as? String,
                    textColor: (json["textColor"] as? String).map { Color(hex: $0) } ?? .primary,
                    backgroundColor: (json["backgroundColor"] as? String).map { Color(hex: $0) }
                        ?? Color(.systemBackground)
                )
            } else {
                entry = RNWidgetEntry(date: Date(), image: loadImage(),
                                      text: nil, textColor: .primary,
                                      backgroundColor: Color(.systemBackground))
            }
            let reload = Calendar.current.date(
                byAdding: .minute, value: fetchIntervalMin, to: Date())!
            completion(Timeline(entries: [entry], policy: .after(reload)))
        }.resume()
    }

    // MARK: Shared helpers

    private func loadImage() -> UIImage? {
        guard
            let url = FileManager.default
                .containerURL(forSecurityApplicationGroupIdentifier: appGroupId)?
                .appendingPathComponent("widget_\(widgetName).png"),
            let data = try? Data(contentsOf: url)
        else { return nil }
        return UIImage(data: data)
    }
}

// MARK: - View

struct RNWidgetEntryView: View {
    var entry: RNWidgetEntry

    var body: some View {
        switch widgetMode {
        case "clock", "fetch":
            ZStack {
                entry.backgroundColor.ignoresSafeArea()
                if let img = entry.image {
                    Image(uiImage: img)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .ignoresSafeArea()
                } else {
                    Text(entry.text ?? "")
                        .font(widgetMode == "clock"
                              ? .system(size: clockFontSize, weight: .bold, design: .monospaced)
                              : .system(size: 18, weight: .semibold))
                        .foregroundColor(entry.textColor)
                        .multilineTextAlignment(.center)
                        .padding()
                }
            }
        default:
            if let img = entry.image {
                Image(uiImage: img)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .ignoresSafeArea()
            } else {
                Color(.systemBackground)
            }
        }
    }
}

// MARK: - Widget

@main
struct RNWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: widgetName, provider: RNWidgetProvider()) { entry in
            RNWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("My Widget")
        .description("Powered by React Native.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Color hex helper

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b, a: UInt64
        switch hex.count {
        case 6:
            (r, g, b, a) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF, 255)
        case 8:
            (r, g, b, a) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b, a) = (0, 0, 0, 255)
        }
        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}
