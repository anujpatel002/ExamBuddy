/** @type {import('next').NextConfig} */
const nextConfig = {
  // Place the setting inside the 'experimental' block
   experimental: {
    // Replace the IP with the one you found in Step 1
    allowedDevOrigins: ["http://192.168.1.24:3000"],
  },
};

export default nextConfig;