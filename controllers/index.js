export default async function ({ w }) {
	// Temporary redirect from "/" to "/users"
	
	//asdfasdfasdfsadf
	//die(JSON.stringify(w,' ',2));
	
	return w.doRedirect('/users', 302);
}
