const filter = require('../commandData/textReactFilter.json')

module.exports = async (message, channelFilter) => {
    const [ commandsChannel , generalChannel ] = channelFilter
    const { id: cId } = commandsChannel
    const { id: gId } = generalChannel

    const msg = message.content.split(/\s+/)
    var fMsg = []
    for ( i = 0; i < msg.length ; i++) {
        fMsg[i] = msg[i].toLowerCase()
        
        if (message.channel.id == cId || message.channel.id == gId) {
            
            let fWord = filter.filterWords
            for ( j = 0; j < filter.filterWords.length ; j++) {

                let alias = filter[fWord[j]]


                for (k = 0; k < filter[fWord[j]].length ; k++) {
                    switch (fMsg[i]) {
                        case alias[k]:
                            switch (j){
                                case 0:
                                    message.react(alias[0])
                                    break;
                                case 1:
                                    message.react(alias[0])
                                    break;
                                case 2:
                                    message.react(alias[0])
                                    break;
                                case 3:
                                    message.react(alias[0])
                                    break;
                            }
                        break;
                    }
                }
            }
        }
    }
}