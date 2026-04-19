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
      (file.name.endsWith(".jpg") ||
       file.name.endsWith(".png") ||
       file.name.endsWith(".jpeg"))
    );

    const images = await Promise.all(
      imageFiles.map(async (file) => {
        const linkRes = await fetch(
          "https://api.dropboxapi.com/2/files/get_temporary_link",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.DROPBOX_ACCESS_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ path: file.path_lower })
          }
        );

        const linkData = await linkRes.json();
        return linkData.link;
      })
    );

    res.status(200).json(images);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch images" });
  }
}