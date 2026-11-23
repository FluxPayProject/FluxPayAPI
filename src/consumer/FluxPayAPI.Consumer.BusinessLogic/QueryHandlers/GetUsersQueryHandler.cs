using FluxPayAPI.Consumer.BusinessLogic.Models;
using FluxPayAPI.Consumer.Persistence;
using FluxPayAPI.Shared.Application.Abstractions;
using FluxPayAPI.Shared.DTO.Abstractions;
using FluxPayAPI.Shared.DTO.Responses;
using FluxPayAPI.Shared.DTO.Responses.Errors;

namespace FluxPayAPI.Consumer.BusinessLogic.QueryHandlers;

public class GetUsersQueryHandler : ICommandHandler<GetUsersQuery, List<UserDto>>
{
    private readonly DatabaseContext _context;

    public GetUsersQueryHandler(DatabaseContext context)
    {
        _context = context;
    }

    public Task<IResult<List<UserDto>, Error>> HandleAsync(GetUsersQuery command) =>
        UserListQuery.ExecuteAsync(_context, command.RequesterId, command.Page, command.Limit);
}
