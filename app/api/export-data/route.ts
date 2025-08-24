import { type NextRequest, NextResponse } from "next/server"
import type { TrainingCenter } from "@/types"

function convertToCSV(centers: TrainingCenter[]): string {
  const headers = [
    "ID",
    "Name",
    "Category",
    "Address",
    "Phone",
    "Email",
    "Website",
    "Description",
    "Latitude",
    "Longitude",
  ]

  const csvRows = [
    headers.join(","),
    ...centers.map((center) =>
      [
        center.id,
        `"${center.name}"`,
        center.category,
        `"${center.address}"`,
        center.phone || "",
        center.email || "",
        center.website || "",
        center.description ? `"${center.description.replace(/"/g, '""')}"` : "",
        center.coordinates.lat.toString(),
        center.coordinates.lng.toString(),
      ].join(","),
    ),
  ]

  return csvRows.join("\n")
}

export async function POST(request: NextRequest) {
  try {
    const { centers, format }: { centers: TrainingCenter[]; format: "csv" | "json" } = await request.json()

    if (!centers || !Array.isArray(centers)) {
      return NextResponse.json({ error: "Invalid centers data provided" }, { status: 400 })
    }

    let content: string
    let contentType: string

    if (format === "csv") {
      content = convertToCSV(centers)
      contentType = "text/csv"
    } else {
      content = JSON.stringify(centers, null, 2)
      contentType = "application/json"
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="training-centers.${format}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
