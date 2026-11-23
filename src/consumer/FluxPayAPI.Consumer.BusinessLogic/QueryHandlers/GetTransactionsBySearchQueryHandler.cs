using FluxPayAPI.Consumer.BusinessLogic.Models;
using FluxPayAPI.Consumer.Domain.Constants;
using FluxPayAPI.Consumer.Persistence;
using FluxPayAPI.Shared.Application.Abstractions;
using FluxPayAPI.Shared.DTO.Abstractions;
using FluxPayAPI.Shared.DTO.Responses;
using FluxPayAPI.Shared.DTO.Responses.Errors;
using Microsoft.EntityFrameworkCore;

namespace FluxPayAPI.Consumer.BusinessLogic.QueryHandlers;

public class GetTransactionsBySearchQueryHandler : ICommandHandler<GetTransactionsBySearchQuery, List<TransactionDto>>
{
    private readonly DatabaseContext _context;

    public GetTransactionsBySearchQueryHandler(DatabaseContext context)
    {
        _context = context;
    }

    public async Task<IResult<List<TransactionDto>, Error>> HandleAsync(GetTransactionsBySearchQuery command)
    {
        var requester = await _context.UserEntities.FirstOrDefaultAsync(x => x.Id == command.RequesterId);

        if (requester == null)
        {
            return new Result<List<TransactionDto>>(new DbEntityNotFoundError(ResponseMessages.RequesterNotFound));
        }

        var searchText = command.SearchText.ToLowerInvariant();
        var transactions = await _context.TransactionEntities
            .Where(x => x.FromUserId == command.RequesterId || x.ToUserId == command.RequesterId)
            .Where(x => x.Id.ToString().Contains(searchText))
            .Before(command.FromDateTime, command.CursorId)
            .Take(command.Limit)
            .ToDto()
            .ToListAsync();

        return new Result<List<TransactionDto>>(transactions);
    }
}
