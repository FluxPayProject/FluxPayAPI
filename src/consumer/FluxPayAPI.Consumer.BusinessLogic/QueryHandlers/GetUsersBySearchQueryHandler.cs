using FluxPayAPI.Consumer.BusinessLogic.Models;
using FluxPayAPI.Consumer.Persistence;
using FluxPayAPI.Shared.Application.Abstractions;
using FluxPayAPI.Shared.DTO.Abstractions;
using FluxPayAPI.Shared.DTO.Responses;
using FluxPayAPI.Shared.DTO.Responses.Errors;

namespace FluxPayAPI.Consumer.BusinessLogic.QueryHandlers;

public class GetUsersBySearchQueryHandler : ICommandHandler<GetUsersBySearchQuery, List<UserDto>>
{
    private readonly DatabaseContext _context;

    public GetUsersBySearchQueryHandler(DatabaseContext context)
    {
        _context = context;
    }

    public Task<IResult<List<UserDto>, Error>> HandleAsync(GetUsersBySearchQuery command) =>
        UserListQuery.ExecuteAsync(_context, command.RequesterId, command.Page, command.Limit, $"%{command.Email}%");
}
