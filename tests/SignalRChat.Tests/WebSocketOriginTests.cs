using System.Net.WebSockets;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SignalRChat.Tests;

// TestServer は WebSocket の origin 検査を通らないため、 Kestrel で起動して確認します。
public sealed class WebSocketOriginTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory = new();
    private readonly Uri _baseAddress;

    public WebSocketOriginTests()
    {
        _factory.UseKestrel(0);
        _factory.StartServer();
        _baseAddress = _factory.ClientOptions.BaseAddress;
    }

    public void Dispose() => _factory.Dispose();

    private async Task ConnectWithOriginAsync(string origin)
    {
        using var socket = new ClientWebSocket();
        socket.Options.SetRequestHeader("Origin", origin);
        var uri = new UriBuilder(_baseAddress) { Scheme = "ws", Path = "/chatHub" }.Uri;
        await socket.ConnectAsync(uri, TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task WebSocket_AcceptsSameOrigin()
    {
        await ConnectWithOriginAsync(_baseAddress.GetLeftPart(UriPartial.Authority));
    }

    [Fact]
    public async Task WebSocket_AcceptsWebBaseUrl()
    {
        await ConnectWithOriginAsync("http://localhost:8080");
    }

    [Fact]
    public async Task WebSocket_RejectsOtherOrigin()
    {
        await Assert.ThrowsAsync<WebSocketException>(() => ConnectWithOriginAsync("https://evil.example.com"));
    }
}
