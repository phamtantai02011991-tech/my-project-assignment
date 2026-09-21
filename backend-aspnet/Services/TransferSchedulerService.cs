using EmployeeTransferApi.Repositories;

namespace EmployeeTransferApi.Services;

public class TransferSchedulerService : BackgroundService
{
    private readonly IServiceProvider _services;
    private readonly ILogger<TransferSchedulerService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromSeconds(15);

    public TransferSchedulerService(IServiceProvider services, ILogger<TransferSchedulerService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 [Scheduler] Transfer Background Scheduler active with 15s interval.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _services.CreateScope();
                var trfRepo = scope.ServiceProvider.GetRequiredService<ITransferRepository>();
                var today = DateTime.UtcNow.ToString("yyyy-MM-dd");

                var dueList = trfRepo.GetScheduledDueTransfers(today);
                if (dueList.Count > 0)
                {
                    _logger.LogInformation("Found {count} scheduled transfers due for execution on {date}", dueList.Count, today);
                    foreach (var trf in dueList)
                    {
                        try
                        {
                            trfRepo.ExecuteAtomicTransferST(trf.TransferId, today, "SCHEDULED_AUTOMATIC_EXECUTION", null, "System.Scheduler");
                            _logger.LogInformation("Successfully executed scheduled transfer {code}", trf.TransferCode);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error executing scheduled transfer {id}", trf.TransferId);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in TransferSchedulerService loop.");
            }

            await Task.Delay(_interval, stoppingToken);
        }
    }
}
