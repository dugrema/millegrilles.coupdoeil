module.exports = {
  devServer: {
    port: 3002,
    https: {
         key: fs.readFileSync('/home/mathieu/certificates/dev2.maple.mdugre.info/privkey.pem'),
         cert: fs.readFileSync('/home/mathieu/certificates/certs/dev2.maple.mdugre.info/fullchain.pem'),
    }
  }
}
