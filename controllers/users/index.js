export default async function ({ w, VIEW }) {
	const rows = await w.m.users.list();

	VIEW.TITLE = 'User List';
	VIEW.USERS = rows.map(r => ({ id: r.id, name: r.name }));
	//die(JSON.stringify(VIEW,' ',2));

	return w.renderView();
	
	
}
