using FluxPayAPI.Consumer.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FluxPayAPI.Consumer.BusinessLogic.QueryHandlers;

internal static class CursorPagination
{
    public static IOrderedQueryable<TEntity> Before<TEntity>(
        this IQueryable<TEntity> query, DateTime fromDateTime, Guid? cursorId)
        where TEntity : class
    {
        var filtered = cursorId is Guid id
            ? query.Where(entity => EF.Functions.LessThan(
                ValueTuple.Create(EF.Property<DateTime>(entity, nameof(TransactionEntity.CreatedAt)),
                    EF.Property<Guid>(entity, nameof(TransactionEntity.Id))),
                ValueTuple.Create(fromDateTime, id)))
            : query.Where(entity => EF.Property<DateTime>(entity, nameof(TransactionEntity.CreatedAt)) < fromDateTime);

        return filtered
            .OrderByDescending(entity => EF.Property<DateTime>(entity, nameof(TransactionEntity.CreatedAt)))
            .ThenByDescending(entity => EF.Property<Guid>(entity, nameof(TransactionEntity.Id)));
    }
}
