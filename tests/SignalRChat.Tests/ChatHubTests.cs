using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace SignalRChat.Tests;

public class ChatHubTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    private async Task<HubConnection> ConnectAsync()
    {
        var connection = new HubConnectionBuilder()
            .WithUrl(
                new Uri(factory.Server.BaseAddress, "chatHub"),
                options => options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        await connection.StartAsync(TestContext.Current.CancellationToken);
        return connection;
    }

    [Fact]
    public async Task SendMessage_BroadcastsToAllClients()
    {
        await using var sender = await ConnectAsync();
        await using var receiver = await ConnectAsync();
        var received = new TaskCompletionSource<(string User, string Message)>();
        receiver.On<string, string>("ReceiveMessage", (user, message) => received.TrySetResult((user, message)));

        await sender.InvokeAsync("SendMessage", "alice", "hello", TestContext.Current.CancellationToken);

        var result = await received.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);
        Assert.Equal(("alice", "hello"), result);
    }

    [Theory]
    [InlineData("alice", "")]
    [InlineData("alice", "   ")]
    [InlineData("", "hello")]
    public async Task SendMessage_RejectsBlankInput(string user, string message)
    {
        await using var connection = await ConnectAsync();

        await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync("SendMessage", user, message, TestContext.Current.CancellationToken));
    }

    [Theory]
    [InlineData(51, 1)]
    [InlineData(1, 501)]
    public async Task SendMessage_RejectsTooLongInput(int userLength, int messageLength)
    {
        await using var connection = await ConnectAsync();

        await Assert.ThrowsAsync<HubException>(
            () => connection.InvokeAsync(
                "SendMessage",
                new string('a', userLength),
                new string('a', messageLength),
                TestContext.Current.CancellationToken));
    }
}
