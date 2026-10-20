using Microsoft.AspNetCore.SignalR;

namespace SignalRChat.Hubs;

public class ChatHub(ILogger<ChatHub> logger) : Hub
{
    public const int MaxUserLength = 50;
    public const int MaxMessageLength = 500;

    // 接続されたクライアントから呼び出されます。
    public async Task SendMessage(string user, string message)
    {
        if (string.IsNullOrWhiteSpace(user) || user.Length > MaxUserLength)
        {
            throw new HubException($"User は 1 から {MaxUserLength} 文字で入力してください。");
        }
        if (string.IsNullOrWhiteSpace(message) || message.Length > MaxMessageLength)
        {
            throw new HubException($"Message は 1 から {MaxMessageLength} 文字で入力してください。");
        }

        logger.LogInformation("ChatHub.SendMessage からのログ!!!! 飛んできた引数は…… {User}: {Message}", user, message);
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }
}
