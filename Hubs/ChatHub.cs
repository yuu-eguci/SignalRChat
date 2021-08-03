using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace SignalRChat.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ILogger<ChatHub> _logger;

        public ChatHub(ILogger<ChatHub> logger)
        {
            this._logger = logger;
        }

        // 接続されたクライアントから呼び出されます。
        public async Task SendMessage(string user, string message)
        {
            _logger.LogInformation($"ChatHub.SendMessage からのログ!!!! 飛んできた引数は…… {user}: {message}");
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }
    }
}
