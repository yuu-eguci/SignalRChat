using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;

namespace SignalRChat.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }

        public void OnGet()
        {
            Console.WriteLine("Console.WriteLine からのログ!!!!");
            _logger.Log(LogLevel.Information, "_logger.Log LogLevel.Information からのログ!!!!");
            _logger.LogInformation("_logger.LogInformation からのログ!!!!");
            _logger.LogError("_logger.LogError からのログ!!!!");
        }
    }
}
