VYERO VERCEL DEPLOYMENT

This is a READ-ONLY storefront snapshot. Product catalogue, images, shopping UI and WhatsApp checkout are included.

IMPORTANT: The original admin dashboard and backend are NOT included because their local-file write/storage design cannot work reliably on Vercel. To edit products later, update data/store.json AND api/store.json and redeploy, or add a persistent database and image storage backend.

1. Extract this ZIP to a folder.
2. Upload folder contents to a NEW GitHub repository (do not upload the ZIP as a single file).
3. Vercel > Add New > Project > Import Git Repository.
4. Framework Preset: Other. Root Directory: ./ . Build command: leave blank / override off. Output directory: leave blank.
5. Deploy. Test home page, product pages, product images and WhatsApp checkout.

Do not upload your original .env file; it contains secrets.
