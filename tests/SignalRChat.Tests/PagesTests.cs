using System.Net;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc.Testing;

namespace SignalRChat.Tests;

public class PagesTests(WebApplicationFactory<Program> factory)
    : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task IndexPage_RendersChatForm()
    {
        var client = factory.CreateClient();

        var html = await client.GetStringAsync("/", TestContext.Current.CancellationToken);

        Assert.Contains("id=\"messageInput\"", html);
        Assert.Contains("js/signalr/dist/browser/signalr.min.js", html);
        Assert.Contains("js/chat.js", html);
    }

    [Fact]
    public async Task PrivacyPage_ReturnsOk()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/Privacy", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ChatHub_AllowsCorsFromWebBaseUrl()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/chatHub/negotiate");
        request.Headers.Add("Origin", "http://localhost:8080");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        Assert.Equal("http://localhost:8080", response.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task ChatHub_RejectsCorsFromOtherOrigin()
    {
        var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Options, "/chatHub/negotiate");
        request.Headers.Add("Origin", "https://evil.example.com");
        request.Headers.Add("Access-Control-Request-Method", "POST");

        var response = await client.SendAsync(request, TestContext.Current.CancellationToken);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task IndexPage_ReferencesOnlyExistingLocalAssets()
    {
        var client = factory.CreateClient();
        var html = await client.GetStringAsync("/", TestContext.Current.CancellationToken);

        var assets = Regex.Matches(html, "(?:src|href)=\"(/(?:lib|js|css)/[^\"]+)\"")
            .Select(match => match.Groups[1].Value)
            .ToList();

        Assert.Contains(assets, asset => asset.StartsWith("/lib/bootstrap/dist/css/bootstrap.min.css", StringComparison.Ordinal));
        Assert.DoesNotContain(assets, asset => asset.Contains("jquery", StringComparison.Ordinal));
        foreach (var asset in assets)
        {
            var response = await client.GetAsync(asset, TestContext.Current.CancellationToken);
            Assert.True(response.IsSuccessStatusCode, asset);
        }
    }
}
