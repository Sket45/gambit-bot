const mongo = require('../mongo.js')
const profileSchema = require('../Schemas/profile-schema');

module.exports = {
    name: 'addbal',
    description: 'Adds balance to user',
    async execute(message, amount){
        let user = message.mentions.members.first() 


        await mongo().then(async mongoose => {
            try{
                await profileSchema.findOneAndUpdate({
                    _id: user.id
                },{
                    $inc: {
                        balance: amount
                    }
                },{
                    upsert: true
                })


            } finally {
                mongoose.connection.close()
            }
        })
    }

}