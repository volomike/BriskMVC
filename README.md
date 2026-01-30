# HOW TO USE

1. Load the BriskMVC system with:

```
bun --hot server.js
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


