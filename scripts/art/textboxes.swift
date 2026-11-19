// Prints, per image, the bounding boxes of any text Vision finds (normalised, origin top-left) as JSON.
import Foundation
import Vision
import AppKit

var out: [String: [[Double]]] = [:]
for path in CommandLine.arguments.dropFirst() {
    guard let img = NSImage(contentsOfFile: path),
          let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
    var boxes: [[Double]] = []
    let req = VNRecognizeTextRequest { r, _ in
        for o in (r.results as? [VNRecognizedTextObservation]) ?? [] {
            let b = o.boundingBox
            boxes.append([Double(b.minX), Double(1 - b.maxY), Double(b.width), Double(b.height)])
        }
    }
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    req.minimumTextHeight = 0.008
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
    // also catch stylised lettering the recogniser can't read
    let det = VNDetectTextRectanglesRequest { r, _ in
        for o in (r.results as? [VNTextObservation]) ?? [] {
            let b = o.boundingBox
            boxes.append([Double(b.minX), Double(1 - b.maxY), Double(b.width), Double(b.height)])
        }
    }
    try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([det])
    out[(path as NSString).lastPathComponent] = boxes
}
let data = try! JSONSerialization.data(withJSONObject: out, options: [.sortedKeys])
print(String(data: data, encoding: .utf8)!)
