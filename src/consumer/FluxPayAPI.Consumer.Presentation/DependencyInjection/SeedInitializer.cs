using System.Security.Cryptography;
using FluxPayAPI.Consumer.Domain.Constants;
using FluxPayAPI.Consumer.Domain.Entities;
using FluxPayAPI.Consumer.Persistence;
using FluxPayAPI.Shared.DTO.Enums;

namespace FluxPayAPI.Consumer.Presentation.DependencyInjection;

public static class SeedInitializer
{
    public static async Task InitializeSeeds(this IApplicationBuilder app)
    {
        using var serviceScope = app.ApplicationServices.GetRequiredService<IServiceScopeFactory>().CreateScope();

        using var context = serviceScope.ServiceProvider.GetService<DatabaseContext>();

        var areThereUsersSeeds = context.UserEntities.Any();

        if (areThereUsersSeeds)
        {
            return;
        }
        
        // user and wallet seeds 
        var aliceWallet = new WalletEntity(1000);
        var bobWallet = new WalletEntity(2000);
        var alexWallet = new WalletEntity(200000);
        var dimaWallet = new WalletEntity(50000000);
        var sashaWallet = new WalletEntity(44332);

        var alice = new UserEntity(UserSeedIdConstants.AliceId, "alice@gmail.com", aliceWallet.Id, UserRole.User, UserStatus.Active);
        var bob = new UserEntity(UserSeedIdConstants.BobId, "bob@gmail.com", bobWallet.Id, UserRole.User, UserStatus.Suspended);
        var alex = new UserEntity(UserSeedIdConstants.AlexId, "alex@gmail.com", alexWallet.Id, UserRole.User, UserStatus.Active);
        var dima = new UserEntity(UserSeedIdConstants.DimaId, "dima@gmail.com", dimaWallet.Id, UserRole.Admin, UserStatus.Active);
        var sasha = new UserEntity(UserSeedIdConstants.SashaId, "sasha@gmail.com", sashaWallet.Id, UserRole.User, UserStatus.Active);
        
        var users = new List<UserEntity> { alice, bob, alex, dima, sasha };

        context.WalletEntities.AddRange(aliceWallet, bobWallet, alexWallet, dimaWallet, sashaWallet);
        context.UserEntities.AddRange(users);

        await context.SaveChangesAsync();
        
        // transaction seeds
        var transactionList = new List<TransactionEntity>();
        AddTransactions(transactionList, dima, bob, 10000, 45);
        AddTransactions(transactionList, alex, alice, 1000, 20);
        AddTransactions(transactionList, dima, sasha, 700, 20);
        AddTransactions(transactionList, dima, bob, 8000, 10);
        AddTransactions(transactionList, bob, sasha, 1000, 15);
        AddTransactions(transactionList, dima, alex, 7775, 15);

        context.TransactionEntities.AddRange(transactionList);
        
        await context.SaveChangesAsync();
        
        // make suspended users
        sasha.UpdateUserStatus(UserStatus.Suspended);
        alex.UpdateUserStatus(UserStatus.Suspended);
        
        await context.SaveChangesAsync();
        
        // make admin
        dima.UpdateUserRole(UserRole.Admin);
        
        await context.SaveChangesAsync();
    }

    private static void AddTransactions(
        List<TransactionEntity> transactions, UserEntity first, UserEntity second, decimal amount, int count)
    {
        for (var i = 0; i < count; i++)
        {
            var (from, to) = RandomNumberGenerator.GetInt32(2) == 0 ? (first, second) : (second, first);
            transactions.Add(new TransactionEntity(from.Id, to.Id, amount, TransactionType.FromUserToUser, DateTime.UtcNow));
        }
    }
}
