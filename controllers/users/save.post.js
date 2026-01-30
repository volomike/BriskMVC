export default async function ({ w }) {
	const mode = w.post?.mode;
	const id = w.post?.id ? Number(w.post.id) : null;
	const fullname = w.post?.fullname || '';

	if (mode === 'edit' && id) {
		await w.m.users.updateById(id, fullname);
	} else {
		await w.m.users.add(fullname);
	}

	return w.json({
		ok: true,
		redirect: '/users'
	});
}
