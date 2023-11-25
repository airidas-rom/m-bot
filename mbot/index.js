const mineflayer = require('mineflayer')


// LITTLE CONFIG
// "all" - connects all bots in the list
// "1:4" - connects bots from 1 to 4 in the list
// "1" or "1, 4, 5" - connects bot with a specified num, multiple is possible
const bots_who_join = "1"; // Replace with user input (e.g., "1,3")
let host = 'localhost'
let port = '20160'

// BOTS DATA
const data = {
  bot1: { host: host, port: port, username: 'Player1' },
  bot2: { host: host, port: port, username: 'Player2' },
  bot3: { host: host, port: port, username: 'Player3' },
  bot4: { host: host, port: port, username: 'Player4' },
  bot5: { host: host, port: port, username: 'Player5' },
  bot6: { host: host, port: port, username: 'Player6' },
  bot7: { host: host, port: port, username: 'Player7' },
}

// Create an array to store promises for each bot connection
const botPromises = [];
// BOTS JOIN LOGIC
if (bots_who_join === "all") {
  for (const botName in data) {
    const botInfo = data[botName];
    const bot = mineflayer.createBot(botInfo);

    const botPromise = new Promise((resolve) => {
      bot.once('spawn', () => {
        console.log(`Instance Connected | User: ${botInfo.username} | IP: ${botInfo.host}.`);
        // Resolve the promise when the bot has connected
        resolve(bot);
      });
    });

    botPromises.push(botPromise);
  }
} else if (/^\d+(,\s*\d+)*$/.test(bots_who_join)) {
  const botNumbers = bots_who_join.split(',').map(Number);
  
  for (const botNumber of botNumbers) {
    const botName = `bot${botNumber}`;
  
    if (data[botName]) {
      const botInfo = data[botName];
      const bot = mineflayer.createBot(botInfo);
  
      const botPromise = new Promise((resolve) => {
        bot.once('spawn', () => {
          console.log(`Instance Connected | User: ${botInfo.username} | IP: ${botInfo.host}.`);
          // Resolve the promise when the bot has connected
          resolve(bot);
        });
      });

      botPromises.push(botPromise);
    } else {
      console.log(`Bot with number ${botNumber} does not exist.`);
    }
  }
} else if (/^\d+:\d+$/.test(bots_who_join)) {
  const [start, end] = bots_who_join.split(':').map(Number);
  
  if (start <= end) {
    for (let i = start; i <= end; i++) {
      const botName = `bot${i}`;
  
      if (data[botName]) {
        const botInfo = data[botName];
        const bot = mineflayer.createBot(botInfo);
    
        const botPromise = new Promise((resolve) => {
          bot.once('spawn', () => {
            console.log(`Instance Connected | User: ${botInfo.username} | IP: ${botInfo.host}.`);
            // Resolve the promise when the bot has connected
            resolve(bot);
          });
        });

        botPromises.push(botPromise);
      } else {
        console.log(`Bot with number ${i} does not exist.`);
      }
    }
  } else {
    console.log("Invalid range. Start number must be less than or equal to end number.");
  }
} else {
  console.log("Invalid input format. Use 'all' or a comma-separated list of numbers.");
}



// SOME LIBRARIES
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const vec3 = require('vec3');
const collectBlock = require('mineflayer-collectblock').plugin
const minecraftData = require('minecraft-data')
const tool = require('mineflayer-tool').plugin
const autoeat = require('mineflayer-auto-eat').plugin

// ACTIONS BOTS WILL DO WHEN JOINED
// Use Promise.all to wait for all bot promises to resolve
Promise.all(botPromises)
  .then((bots) => {
    // All bots have connected, and you can perform actions with them here

    for (let i = 0; i < bots.length; i++) {
      const bot = bots[i];

      // LOAD PLUGINS
      bot.loadPlugin(pathfinder);
      bot.loadPlugin(collectBlock)
      bot.loadPlugin(tool)
      bot.loadPlugin(autoeat)

      let mcData
      const defaultMove = new Movements(bot);


      // RECONNECT
      /*let isReconnecting = false;
      bot.on('chat', (username, message) => {
        if (username == bot.username) return
        const regex = new RegExp(`${bot.username} rr`, 'i'); // 'i' flag for case-insensitive match
            if (regex.test(message)) {
              const targetBotName = message.split(' ')[0]; // Extract the target bot's name
              if (targetBotName === bot.username && !isReconnecting) {
                let username_who_left = bot.username
                isReconnecting = true;

                bot.quit();

                bot.once('end', () => {
                  const bot_info = {
                    host: host,
                    port: port,
                    username: username_who_left
                  }
                  const bot = mineflayer.createBot(bot_info)
                  isReconnecting = false;
                })
                
                
              }
            }

      })*/

      bot.chat('Hello from bot!');

      // COME
      bot.on('chat', async (username, message) => {
        if (username === bot.username) return;
        
        // Check if the message contains the bot's username followed by "come"
        const regex = new RegExp(`${bot.username} come`, 'i'); // 'i' flag for case-insensitive match
        if (regex.test(message)) {
          const targetBotName = message.split(' ')[0]; // Extract the target bot's name
          if (targetBotName === bot.username) {
            const target = bot.players[username] ? bot.players[username].entity : null;
            if (!target) {
              bot.chat('I don\'t see you!');
              return;
            }
            const p = target.position;
            bot.pathfinder.setMovements(defaultMove);
            bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 0));
          }
        } else if (message == 'everyone come') {
          const target = bot.players[username] ? bot.players[username].entity : null;
          if (!target) {
            bot.chat('I don\'t see you!');
            return;
          }
          const p = target.position;
          bot.pathfinder.setMovements(defaultMove);
          bot.pathfinder.setGoal(new GoalNear(p.x, p.y, p.z, 0));

        }
      });

      // ALIGN
      bot.on('chat', async (username, message) => {
        if (username === bot.username) return;
        const args = message.split(' ')
        if ( args.length !== 4 || args[0] !== 'align') return

        const startX = parseInt(args[1]);
        const startZ = parseInt(args[2]);
        const direction = args[3].toLowerCase();

        let xPosition, zPosition;
        switch (direction) {
          case 'north':
            xPosition = startX;
            zPosition = startZ - (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            break;
          case 'south':
            xPosition = startX;
            zPosition = startZ + (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            break;
          case 'west':
            xPosition = startX - (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            zPosition = startZ;
            break;
          case 'east':
            xPosition = startX + (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            zPosition = startZ;
            break;
          case 'northwest':
            xPosition = startX - (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            zPosition = startZ - (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            break;
          case 'northeast':
            xPosition = startX + (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            zPosition = startZ - (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            break;
          case 'southwest':
            xPosition = startX - (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            zPosition = startZ + (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            break;
          case 'southeast':
            xPosition = startX + (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            zPosition = startZ + (i * 5); // Adjust the spacing as needed (2 blocks between each bot)
            break;
          default:
            bot.chat('Invalid direction. Use: north, south, west, east, northwest, northeast, southwest, or southeast.');
            return;
        }

        // Set the goal for each bot to align at the specified coordinates
        bot.pathfinder.setMovements(defaultMove);
        bot.pathfinder.setGoal(new GoalNear(xPosition, bot.entity.position.y, zPosition, 0.5));



      })

      // HELLO
      bot.on('chat', async (username, message) => {
        const regex = new RegExp(`${bot.username} hello`, 'i'); // 'i' flag for case-insensitive match
        if (regex.test(message)) {
          const targetBotName = message.split(' ')[0]; // Extract the target bot's name
          if (targetBotName === bot.username) {
            bot.chat('Hello!')
            return
          }
        } else if (message == "everyone hello") {
          bot.chat('Hello to you too!')
          return
        }

        /*const args = message.split(' ')

        if (username == bot.username) return

        if (args[0] !== 'hello') return

        bot.chat('hello back')
        return*/
        
      })

      // COLLECT
      bot.on('chat', async (username, message) => {
        mcData = require('minecraft-data')(bot.version)
        
        const args = message.split(' ')
        if (args[0] !== 'collect') return
      
        let count = 1
        if (args.length === 3) count = parseInt(args[1])
      
        let type = args[1]
        if (args.length === 3) type = args[2]
      
        const blockType = mcData.blocksByName[type]
        if (!blockType) {
          return
        }
      
        const blocks = bot.findBlocks({
          matching: blockType.id,
          maxDistance: 64,
          count: count
        })
      
        if (blocks.length === 0) {
          console.log("I don't see that block nearby.")
          return
        }
      
        const targets = []
        for (let i = 0; i < Math.min(blocks.length, count); i++) {
          targets.push(bot.blockAt(blocks[i]))
        }
      
        console.log(`Found ${targets.length} ${type}(s)`)
      
        try {
          await bot.collectBlock.collect(targets)
          // All blocks have been collected.
          console.log('Done')
        } catch (err) {
          // An error occurred, report it.
          bot.chat(err.message)
          console.log(err)
        }
      })


      // FISH
      // To fish we have to give bot the fishing rod and teleport bot to the water
      // /give fisherman fishing_rod 1
      // /teleport fisherman ~ ~ ~

      // To eat we have to apply hunger first
      // /effect fisherman minecraft:hunger 1 255

      let nowFishing = false;
      let fishingFlag = false;

      bot.on('chat', (username, message) => {
        const regex_start = new RegExp(`${bot.username} start fishing`, 'i'); // 'i' flag for case-insensitive match
        const regex_stop = new RegExp(`${bot.username} stop fishing`, 'i');
        if (regex_start.test(message)) {
          const targetBotName = message.split(' ')[0]; // Extract the target bot's name
          if (targetBotName === bot.username) {
            startFishing()
          
          }
      } else if (regex_stop.test(message)) {
        const targetBotName = message.split(' ')[0]; // Extract the target bot's name
        if (targetBotName === bot.username) {
          stopFishing()
        }
      } else if (message == "everyone stop fishing") {
        stopFishing()
      }



        /*if (cm.toString().includes('start')) {
          startFishing()
        }

        if (cm.toString().includes('stop')) {
          stopFishing()
        }*/

        function onCollect(player, entity) {
          if (entity.kind === 'Drops' && player === bot.entity) {
            bot.removeListener('playerCollect', onCollect);
            if (fishingFlag) {
              startFishing();
            }
          }
        }

        async function startFishing() {
          mcData = require('minecraft-data')(bot.version)
          console.log('Fishing');

          const type = "water"

          const blockType = mcData.blocksByName[type]
            if (!blockType) {
                console.log('no such block')
                return
            }

          const blocks = bot.findBlocks({
            matching: blockType.id,
            maxDistance: 6,
            count: 1
          })
          console.log(blocks[0].position)

          if (blocks.length === 0) {
            console.log("I don't see that block nearby.")
            return
          } else {
            console.log(blocks.position)
            const targetPosition = blocks[0].position;
            console.log("found water")
            console.log(targetPosition)
            await bot.lookAt(vec3(targetPosition))
          }


          try {
            await bot.equip(bot.registry.itemsByName.fishing_rod.id, 'hand');
          } catch (err) {
            return bot.chat(err.message);
          }

          nowFishing = true;
          bot.on('playerCollect', onCollect);

          fishingFlag = true; // Set the fishing flag to true

          while (fishingFlag) {
            try {
              await bot.fish();
            } catch (err) {
              bot.chat(err.message);
            }
          }

          nowFishing = false;
        }

        function stopFishing() {
          bot.removeListener('playerCollect', onCollect);
          fishingFlag = false; // Set the fishing flag to false

          if (nowFishing) {
            bot.activateItem();
          }
        }

      /*bot.once('spawn', () => {
        bot.autoEat.options = {
          priority: 'foodPoints',
          startAt: 14,
          bannedFood: []
        }
      })
      // The bot eats food automatically and emits these events when it starts eating and stops eating.

      bot.on('autoeat_started', () => {
        console.log('Auto Eat started!')
        return
      })

      bot.on('autoeat_stopped', () => {
        console.log('Auto Eat stopped!')
      })

      bot.on('health', () => {
        if (bot.food === 20) bot.autoEat.disable()
        // Disable the plugin if the bot is at 20 food points
        else bot.autoEat.enable() // Else enable the plugin again
      })*/
  })

  // SLAP
  bot.on('chat', async (username, message) =>{
    if (username == bot.username) return
    const args = message.split(' ')
    if (args[0] !== 'slap') return

    enemy_username = username

    if (args.length == 2) {
      enemy_username = args[1]
    }

    attackPlayer(enemy_username)

    function attackPlayer (enemy_username) {
      const player = bot.players[enemy_username]
      if (!player || !player.entity) {
        bot.chat('I can\'t see you')
      } else {
        //bot.chat(`Attacking ${player.username}`)
        bot.attack(player.entity)
      }
    }
  })

  // SLEEP  WAKEUP
  bot.on('chat', async (username, message) => {
    if (username === bot.username) return
    switch (message) {
      case 'sleep':
        goToSleep()
        break
      case 'wakeup':
        wakeUp()
        break
    }

    bot.on('sleep', () => {
      bot.chat('Good night!')
    })
    bot.on('wake', () => {
      bot.chat('Good morning!')
    })
  
    async function goToSleep () {
      const bed = bot.findBlock({
        matching: block => bot.isABed(block)
      })
      if (bed) {
        try {
          await bot.sleep(bed)
          bot.chat("I'm sleeping")
        } catch (err) {
          bot.chat(`I can't sleep: ${err.message}`)
        }
      } else {
        bot.chat('No nearby bed')
      }
    }
    
    async function wakeUp () {
      try {
        await bot.wake()
      } catch (err) {
        bot.chat(`I can't wake up: ${err.message}`)
      }
    }
  })
  
  // FARM
  let isFarming = false;
  bot.on('chat', async (username, message) => {
    if (username == bot.username) return
    const regex = new RegExp(`${bot.username} farm`, 'i'); // 'i' flag for case-insensitive match
        if (regex.test(message)) {
          const targetBotName = message.split(' ')[0]; // Extract the target bot's name
          if (targetBotName === bot.username && !isFarming) {
            isFarming = true;
            console.log('started farming')
            function blockToSow () {
                return bot.findBlock({
                point: bot.entity.position,
                matching: bot.registry.blocksByName.farmland.id,
                maxDistance: 9,
                useExtraInfo: (block) => {
                    const blockAbove = bot.blockAt(block.position.offset(0, 1, 0))
                    return !blockAbove || blockAbove.type === 0
                }
                })
            }
            let block_name
            function blockToHarvest () {
                return bot.findBlock({
                point: bot.entity.position,
                maxDistance: 4,
                matching: (block) => {
                    return block && block.type === bot.registry.blocksByName.wheat.id && block.metadata === 7 || block && block.type === bot.registry.blocksByName.carrots.id && block.metadata === 7 || block && block.type === bot.registry.blocksByName.potatoes.id && block.metadata === 7
                }
                })
            }
            async function loop () {
                try {
                while (isFarming) { // while(1)
                    const toHarvest = blockToHarvest()
                    //console.log(toHarvest)
                    if (toHarvest) {
                    block_name = toHarvest.name
                    
                    } else {
                    break
                    }
                    if (toHarvest) {
                    await bot.dig(toHarvest)

                    const toSow = blockToSow()
                    if (toSow) {
                        if (block_name == "wheat") {
                        await bot.equip(bot.registry.itemsByName.wheat_seeds.id, 'hand')
                        await bot.placeBlock(toSow, new vec3(0, 1, 0))
                    } else if (block_name == "carrots") {
                        await bot.equip(bot.registry.itemsByName.carrot.id, 'hand')
                        await bot.placeBlock(toSow, new vec3(0, 1, 0))
                    } else if (block_name == 'potatoes') {
                        await bot.equip(bot.registry.itemsByName.potato.id, 'hand')
                        await bot.placeBlock(toSow, new vec3(0, 1, 0))
                    } else {
                        break
                    }
                    }

                    } else {
                    break
                    }
                }
                } catch (e) {
                console.log(e)
                }
            
                // No block to harvest or sow. Postpone next loop a bit
                setTimeout(loop, 1000)
            }
            loop()
            }
        } else if (message == "everyone farm") {
          isFarming = true;
            console.log('started farming')
            function blockToSow () {
                return bot.findBlock({
                point: bot.entity.position,
                matching: bot.registry.blocksByName.farmland.id,
                maxDistance: 9,
                useExtraInfo: (block) => {
                    const blockAbove = bot.blockAt(block.position.offset(0, 1, 0))
                    return !blockAbove || blockAbove.type === 0
                }
                })
            }
            let block_name
            function blockToHarvest () {
                return bot.findBlock({
                point: bot.entity.position,
                maxDistance: 4,
                matching: (block) => {
                    return block && block.type === bot.registry.blocksByName.wheat.id && block.metadata === 7 || block && block.type === bot.registry.blocksByName.carrots.id && block.metadata === 7 || block && block.type === bot.registry.blocksByName.potatoes.id && block.metadata === 7
                }
                })
            }
            async function loop () {
                try {
                while (isFarming) { // while(1)
                    const toHarvest = blockToHarvest()
                    //console.log(toHarvest)
                    if (toHarvest) {
                    block_name = toHarvest.name
                    
                    } else {
                    break
                    }
                    if (toHarvest) {
                    await bot.dig(toHarvest)

                    const toSow = blockToSow()
                    if (toSow) {
                        if (block_name == "wheat") {
                        await bot.equip(bot.registry.itemsByName.wheat_seeds.id, 'hand')
                        await bot.placeBlock(toSow, new vec3(0, 1, 0))
                    } else if (block_name == "carrots") {
                        await bot.equip(bot.registry.itemsByName.carrot.id, 'hand')
                        await bot.placeBlock(toSow, new vec3(0, 1, 0))
                    } else if (block_name == 'potatoes') {
                        await bot.equip(bot.registry.itemsByName.potato.id, 'hand')
                        await bot.placeBlock(toSow, new vec3(0, 1, 0))
                    } else {
                        break
                    }
                    }

                    } else {
                    break
                    }
                }
                } catch (e) {
                console.log(e)
                }
            
                // No block to harvest or sow. Postpone next loop a bit
                setTimeout(loop, 1000)
            }
            loop()
        } else if (message == "stop" && isFarming) {
          isFarming = false
          console.log('stopped farming')
          } 
  })


    }
  })
  .catch((error) => {
    console.error('Error connecting to bots:', error);
  });