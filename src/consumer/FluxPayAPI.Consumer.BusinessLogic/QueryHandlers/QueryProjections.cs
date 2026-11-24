using FluxPayAPI.Consumer.Domain.Entities;
using FluxPayAPI.Consumer.BusinessLogic.Models;

namespace FluxPayAPI.Consumer.BusinessLogic.QueryHandlers;

internal static class QueryProjections
{
    public static IQueryable<TransactionDto> ToDto(this IQueryable<TransactionEntity> query) =>
        query.Select(x => new TransactionDto(
            x.Id, x.FromUserId, x.ToUserId, x.Amount, x.TransactionState, x.TransactionType, x.CreatedAt));

    public static IQueryable<SupportTicketDto> ToDto(this IQueryable<SupportTicketEntity> query) =>
        query.Select(x => new SupportTicketDto(
            x.Id, x.TransactionId, x.UserId, x.WalletId, x.TicketReason, x.TicketJustification,
            x.TicketStatus, x.CreatedAt));
}
