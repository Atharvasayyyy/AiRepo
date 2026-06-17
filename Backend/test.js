const mongoose = require("mongoose");

mongoose.connect(
  "mongodb://ADMIN:ADMIN@ac-piibm7m-shard-00-00.iqhlwcl.mongodb.net:27017/?tls=true"
)
.then(() => console.log("CONNECTED"))
.catch(err => console.error(err));