export default async function handler(req, res) {
  const folderPath = req.query.path || "";

  try {
    const listRes = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ path: folderPath })
    });

    const listData = await listRes.json();

    const imageFiles = listData.entries.filter(file =>
      file[".tag"] === "file" &&
      (file.name.toLowerCase().endsWith(".jpg") ||
       file.name.toLowerCase().endsWith(".png") ||
       file.name.toLowerCase().endsWith(".jpeg"))
    );

  const images = await Promise.all(
  imageFiles.map(async (file) => {
    const thumbRes = await fetch(
      "https://api.dropboxapi.com/2/files/get_thumbnail",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          path: file.path_lower,
          format: "jpeg",
          size: "w1280h960" // 👈 compression level
        })
      }
    );

    const blob = await thumbRes.arrayBuffer();

    const base64 = Buffer.from(blob).toString("base64");

    return `data:image/jpeg;base64,${base64}`;
  })
);

    res.status(200).json(images);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images" });
  }
}
