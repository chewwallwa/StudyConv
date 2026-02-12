Application under development.

https://chewwallwa.github.io/StudyConv/

Sorry for the portuguese comments and lack of simplicity and optimization, it was intended for use, and has heavy hands of AI.

Don't bother, I'm reeally using it for my activities :) I may be occupied. Tell me if you want the project for you :)

The objective is to have a place where I can enter, and have no more to think. Everything is there.

# Site map:

## right sidebar

- Methods
    - Shows two field of text based on the activity. (I use it for for study methods, or details about the activity)
    - settings button
        - google sheet links input (see apendice 2)
        - telegram bot token input for notifies (see the apendice 3)
        - google drive sync of configs and use (see the apendice 1)
        - Export backup file (see the apendice 1)
    - light/dark mode button
    - notes 
    
## left sidebar 

- Schedule
    - shows the day schedule
    - you can check the schedule of a specific day (if the day has one)
    - you can see a compact list of the schedule of some before days after the current one.
- Notes area
- Menu
    - main
    - pomodoro
    - timer
    
PAGES ------------

## main

- timer
    - depends on your schedule. 
    - if it is a "study" tagged activity, it will show a 50 min timer for focus, 5 min for review and 5 min for rest, util that activity ends
    - if it is a "others" tagged activity, it will show the name of the activity and the hour of the next "study" one.
- topics
    - it shows a text text based on the activity and 3 buttons you can set what they are for. (shows the topics of a subject, with buttons to search in youtube with the name of a teacher or a site of the topic or to just copy the topic name)
    - you can choose maximize, normal size and show on hover modes.
- notes: on the side of the main timer. hide/show.
    
## pomodoro

- common pomodoro with custom focus and rest timer
- a floating (not dragable) widget that shows a mini version of main page.
    
## timer

- sequential timers, you can give it names and colors. one will start when the other ends, on the order you created.
- you can create various lists of timers
- the same floating widget that shows a mini version of main page.
            
# ROADAMP ------------

- add buttons or drag&drop to reorder the timers on timer page.

- add a special tag or more tags that overide the common ones, to create a list of special events.

- Don't use google for sync and sheets...

- share my bot for your nofities?

- use supabase or any other login to multi device sync and login

- smartwatch support

- linux (quickshell?) and android versions?

- add custom tags with custom timers? may be too difficult to me and gemini :) it is hardcoded for now

- add option to eddit the schedule inside the site? may be out of scope.

# APENDICE 1: MULTI-DEVICE SYNC ------------

For now it is shity :) It is another google script that recieves content and save on drive. It has password so nobody even with the link will change your things... The script will be shared.

What is synced: 

- theme light/dark
- open on the last page used
- what was toggled (if main note area was on and if the state of topics section)
- all the notes
- all the timer list tabs and its respectives timers

# APENDICE 2: GOOGLE SHEETS ------------

There are 3 sheets: 

- "linear_data" for the schedule + tags
- "material" for the content of "menu > main > topics"
- "methods" for the per activity texts shown in "right sidebar > methods"

# APENDICE 3: TELEGRAM NOTIFIY ------------

For the sake of simplicity, I'm using my own bot and will not share for now :) it is simple to create. but I will share the google script and triggers that sends the notify :)



