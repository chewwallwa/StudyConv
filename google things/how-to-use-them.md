## how to use:

1. the template has many notes to guide you, make you schedule following that:)
2. extensions > apps script > files: add the three scripts
3. run unpivot to create your linear_data sheet that the site will read
4. run each script, specially the function "sendTelegramMessage" to give them permission
5. deploy the sync.gs as web app (execute as [you], who can acess [anyone]), copy the API link to put on the sync field on site
6. add a trigger: deploy [test], function [checkAndNotifyTelegram], event [according with the hour, each hour]
