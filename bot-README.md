# Chatbot Tutorial

Message Arthur
https://m.me/2278578462368010

Based on this Tutorial
https://github.com/jw84/messenger-bot-witai-tutorial

Heroku URL
https://infinite-falls-46264.herokuapp.com/

Facebook Page
https://www.facebook.com/Arthur-Bot-2278578462368010/



### *Create stories in Wit.ai*

Wit.ai does the hard work for you by creating a simple to use interface to manage what are called “stories” — these are ways to extract meaning from a keyword or sentence.

![Alt text](/demo/Demo5.jpg)

For now you might have to write a lot of stories for your chat bot to understand language but soon Wit.ai has a vision that we can share hundreds of stories with each other. And with more stories the more skills your chat bot will have.


## 🎓 Time to teach your bot!

### *Extract location out of conversations*

1. Create a new story in the Wit dashboard. The first type of story we’ll write is extracting location from conversations. This way we can build a weather bot! Go here [https://wit.ai/jw84/weather/stories](https://wit.ai/jw84/weather/stories) to see the recipe I’ve created.

![Alt text](/demo/Demo6.jpg)

2. Find the Read function in the bot.js file. Here the bot can recognize messages. The first message can be hello, the chat bot can send back an introduction. Otherwise, we can pass the message on to Wit.ai for processing.

![Alt text](/demo/Demo7.jpg)

3. Let’s test and see if the weather shows up!

![Alt text](/demo/Demo8.gif)

### *Extract category and sentiment out of conversations*

1. Create yet another Wit app in the dashboard. This new app will have three stories to extract the category and sentiment entities out of a conversation so your chat bot can reply with some cute pics! Go here [https://wit.ai/jw84/cutepics/stories](https://wit.ai/jw84/cutepics/stories) to see the recipe

2. Create a new story to look for the user response then trigger the bot to execute the action and respond.

![Alt text](/demo/Demo9.jpg)

When you double click a word it will be highlighted as blue, after assigning the word as an entity the highlight turns purple to indicate Wit.ai has learned.

Have the bot execute a merge function to extract the entity and save it to the context object. Then execute the fetch-pics action to return the actual pic itself. Thereafter you can trigger two replies by Wit.ai, one saying what the category is and the other the image link itself.

3. Add and create two more stories based on my template. Each will help train Wit.ai on what to look for and how to respond to a sentiment and to an acknowledgement.

![Alt text](/demo/Demo10.jpg)

4. Now we can test. Be sure to update your Heroku server with the new Wit app’s token by running this command:

	```
	heroku config:set WIT_TOKEN='your_new_token_here'
	```

Let’s go back and chat it up. Ask to see some corgis. Then ask to see some racoons!

![Alt text](/demo/Demo11.gif)

Congratulations you’ve made a chat bot that’s smart enough to know what you’re talking about, what you mean, and reply back accordingly!

## 🤓 Tell Your Chat Bot What’s What

NLP and NLU are not magical! They are merely defining rules for your bot. Your chat bot will break sometimes and maybe even often when being told new and interesting conversations it’s never heard before.

It is now up to you to help keep training and testing your bot until it’s the very best. You have two tools in Wit.ai to do so. Go to the console and let’s learn about the Inbox and the Understanding page.

### *Training your chat bot*

Wit.ai has an inbox that shows you all the messages it has received. From here you can pick and choose which one to validate and contribute to the training data of your chat bot.

![Alt text](/demo/Demo12.jpg)

For example, if you have an entity of location you can assign more values to help train your chat bot to know that “San Francisco” and “Timbuktu” are both locations. If you have categories for “corgis” then you can also validate that “dogs” can mean the same thing.

The more people that talk to your chat bot and the more complex your bot is the more you will spend time in this page. And the work you do here will help make your bot even smarter.

### *Testing your chat bot*

The other page you will be spending time at will be in the Understanding page. Here you can try out sentences yourself to test whether your chat bot can understand and to troubleshoot when a sentence doesn’t trigger the right response.

![Alt text](/demo/Demo13.jpg)

## 📡 How to share your bot

Learn how to get your bot approved for public use [here](https://developers.facebook.com/docs/messenger-platform/app-review).

Remember, your chat bot has to be approved by Facebook so that anyone can talk to it. Otherwise, you have to go to the Roles page in your Facebook app and add testers.

![Alt text](/demo/Demo14.jpg)

### *Add a chat button to your webpage*

Go [here](https://developers.facebook.com/docs/messenger-platform/plugin-reference) to learn how to add a chat button your page.
