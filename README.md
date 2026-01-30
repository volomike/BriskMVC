# HOW TO USE

1. Load the BriskMVC system with:

```
bun --hot server.js --watch controllers
```

2. Connection comes into your server.js and gets routed to the controllers based on your URL. So...

```
/			--> controllers/index.js
/users		--> controllers/users/index.js
/users/form	--> controllers/users/form.js
```

However, if it's a POST (JSON or form), then it gets amended with .post.js instead of .js on the end.

The job of the controller is to take the incoming request, read the inputs in various ways you need, call the models for the
heavy lifting and get outputs, and then format the outputs, and then emit the outputs either as JSON, plain text, inject into
an HTML template, or other means. Or, if you don't have outputs, you don't do them.

3. Likewise, unless you override the w.renderView(), the paths are mirrored but we use a "v-" prefix because it's easier when
using your text editor to delineate which file is controllers and which file is view. So a w.renderView() would load...

```
/			--> views/v-index.ejs
/users		--> views/users/v-index.ejs
/users/form	--> views/users/v-form.ejs
```

Plus, these are EJS files which are parameterized HTML templates that use <%, <%-, <%=, %>, and -%> for Javascript code and
variable output. (Lookup EJS file reference online.)

The controller's access to page templates is with a w.renderView() call, and so page templates are also called "views". You can
override the view's default path.

The controller can use the VIEW (aliased also as w.view or w.v) to assign variable properties (ALL CAPS is preferred for easier
visual access in the view templates). Thus, we can do this in the controller:

```
VIEW.FIRSTNAME = 'Jack';
```

...and then in the VIEW we can utilize it like so:

```
<%= VIEW.FIRSTNAME %>
```

4. The models are the serious coding of the system. The controllers should not do the heavy-lifting, just sequencing of events from
these models.

5. The server.js loads a w object which stands for "web". This provides many things like variables and functions for doing web
interactions including requests and responses. To understand all that the "w" object can do, look in briskmvc/context.js for the
const w assignment. You can edit the context.js to extend this if you need.

6. A central config file is avaiable in config/config.js. It's a JSON-ish file. It uses the hjson library to read it. So, you can
compose it either as strict JSON, or you can be a little loose with it and not use double or single quotes around properties, add
comments, etc. The hjson means "human-readable json".

7. You don't need to reload the server service when you make changes usually if Bun is loaded with the --hot option. Just edit
your controllers, models, and views as you see fit and it gets a fresh copy as you desire. If you don't have active development
on your code base, then you can remove the "--hot" option. However, to be honest, Bun runs so fast that the "--hot" option is
something you'll likely leave on all the time except in cases where you have extreme performance concerns.

8. If you have multiple projects that all share this same framework, then you may want to put the briskmvc folder in a central
location, and then use the "ln -s" command to make a Linux alias to it so that all the projects share the same framework and
framework improvements.

9. I have created some useful Bash script to help you with this project:

```
./start     <-- manual start at command line
./restart   <-- MUST EDIT! Where you see the XXXXXX, you need to replace with a systemd service. If you don't know how to use
				the systemd service system on Linux, then ask AI for assistance. I use systemd for all my Bun websites on the
				server and then I map them through NGINX as well. Anyway, what this restart command does is restart this BunJS
				service.
./resetlogs <-- We often use the journalctl command, either as journalctl (without parameters), or as something like:
				journalctl -u XXXXXX.service  # and may also add the -f switch too
				in order to see the console output from the server.js. Well, sometimes it's easier if we clear all the logs
				and start fresh. And that's what this command does.
				WARNING -- please be aware that ./resetlogs will clear all your logs for journalctl. If that's not desirable,
				then don't use it!
```

So, you'll edit your config/config.js and change the port as you need for your systemd & NGINX arrangement, if you are using that
in production. Then, you can use ./start for debugging in development, or ./restart to start the service as you normally would.

10. I have used AI to provide an alternative briskmvc/router.js called briskmc/altrouter.js. You can switch your router to this by
renaming router.js to router.js.ORIG and then altrouter.js to router.js. What this does is remove the standard Elysia router and
utilize one that lets you dynamically add controllers as you desire in the controllers folder. Note, the ./start does the following
command:

bun --hot server.js --watch controllers

That command USUALLY makes it so that this framework will see a new controller has been created and will automatically reload the
server.js as necessary. But I say USUALLY. I have found some odd cases where it didn't work. Note that unlike the Express
framework, Elysia loads all its controllers when it loads from the server.js (and components) so that it optimizes performance.
But if you're in heavy development mode and really want to be able to add/remove/rename controllers frequently without reloading
the server.js manually, then you may want to use this alternative router.js script, instead.

For this alternative router, you may continue the discussion with GrokAI for improvement here:

https://x.com/i/grok/share/284700cfeb4944b998344702526b5a81



