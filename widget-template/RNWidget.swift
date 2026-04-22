import WidgetKit
import SwiftUI

// MARK: - Configuration (edit these two values)
private let appGroupId = "group.com.yourapp.widget"  // must match AndroidWidgets.configureIOS()
private let widgetName = "my_widget"                 // must match registerWidget({ name: "my_widget" })

// MARK: - Timeline

struct RNWidgetEntry: TimelineEntry {
    let date: Date
    let image: UIImage?
}

struct RNWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> RNWidgetEntry {
        RNWidgetEntry(date: Date(), image: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (RNWidgetEntry) -> Void) {
        completion(RNWidgetEntry(date: Date(), image: loadImage()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RNWidgetEntry>) -> Void) {
        let entry = RNWidgetEntry(date: Date(), image: loadImage())
        // .never means the system won't auto-refresh — the app drives updates
        // by calling AndroidWidgets.configureIOS() + updateWidgetWithView()
        completion(Timeline(entries: [entry], policy: .never))
    }

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
