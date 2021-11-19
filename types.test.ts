import service from "output/service";

(async () => {
    const user = { username: '', auth: '', email: '', firstName: '', lastName: '', roleGroups: [] };
    let r = await service.api.v1.users.post(null, {data: user})
})