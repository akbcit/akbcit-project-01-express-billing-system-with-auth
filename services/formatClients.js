function formatClients(clientUsers) {
    const clients = clientUsers.map((clientUser) => {
      return {
        id: clientUser.id,
        username: clientUser.username,
        name: `${clientUser.firstName}${clientUser.lastName ? ` ${clientUser.lastName}` : ""}`,
      };
    });
    return clients;
  }
  
module.exports = formatClients;