export default async function ({ w, VIEW }) {
	const editParam = w.get.edit;
	const addParam = w.get.add;

	let mode = 'add';
	let heading = 'Add User';
	let button = 'Add New User';
	let fullname = '';
	let userId = '';

	if (editParam && !addParam) {
		mode = 'edit';
		const id = Number(editParam);
		const existing = await w.m.users.findById(id);
		if (existing) {
			userId = existing.id;
			fullname = existing.name;
			heading = 'Edit User';
			button = 'Update User';
		}
	}

	VIEW.MODE = mode;
	VIEW.HEADING = heading;
	VIEW.BUTTON = button;
	VIEW.FULLNAME = fullname;
	VIEW.USER_ID = userId;

	return await w.renderView();
}
