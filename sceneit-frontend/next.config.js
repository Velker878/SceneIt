/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Letterboxd avatars
      { protocol: "https", hostname: "a.ltrbxd.com" },
      // TMDB posters and backdrops
      { protocol: "https", hostname: "image.tmdb.org" },
    ],
  },
};

module.exports = nextConfig;
