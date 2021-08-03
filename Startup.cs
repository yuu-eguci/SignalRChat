using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SignalRChat.Hubs;
using SignalRChat.Models;
using Microsoft.Extensions.Logging;

namespace SignalRChat
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddRazorPages();
            // SignalR を ASP.NET Core 依存関係に追加。
            services.AddSignalR();
            // CORS を Configure method で使う準備です。
            services.AddCors();
            services.Configure<AppSettings>(Configuration);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILogger<Startup> logger)
        {
            if (env.IsDevelopment())
            {
                logger.LogInformation("Startup.Configure からログ。 env.IsDevelopment でした!!!!");
                app.UseDeveloperExceptionPage();
            }
            else
            {
                logger.LogInformation("Startup.Configure からログ。 Not env.IsDevelopment でした!!!!");
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            // Make sure the CORS middleware is ahead of SignalR.
            app.UseCors(builder =>
            {
                // TODO: 環境変数か appsettings から取得する。
                builder.WithOrigins("http://localhost:8080")
                    .AllowAnyHeader()
                    .WithMethods("GET", "POST")
                    .AllowCredentials();
            });

            var webSocketOptions = new WebSocketOptions()
            {
                KeepAliveInterval = TimeSpan.FromSeconds(120),
            };
            webSocketOptions.AllowedOrigins.Add("http://localhost:8080");
            app.UseWebSockets(webSocketOptions);

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                // SignalR を ルーティングシステムに追加。
                endpoints.MapHub<ChatHub>("/chatHub");
            });
        }
    }
}
