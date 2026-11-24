using FluxPayAPI.Consumer.BusinessLogic.Models;
using FluxPayAPI.Consumer.Persistence;
using FluxPayAPI.Shared.Application.Abstractions;
using FluxPayAPI.Shared.DTO.Abstractions;
using FluxPayAPI.Shared.DTO.Responses;
using FluxPayAPI.Shared.DTO.Responses.Errors;

namespace FluxPayAPI.Consumer.BusinessLogic.CommandHandlers;

public class UpdateUserRoleCommandHandler : ICommandHandler<UpdateUserRoleCommand, UserDto>
{
    private readonly DatabaseContext _context;

    public UpdateUserRoleCommandHandler(DatabaseContext context)
    {
        _context = context;
    }

    public async Task<IResult<UserDto, Error>> HandleAsync(UpdateUserRoleCommand command)
    {
        var (user, error) = await AdminUserLookup.FindAsync(_context, command.RequesterId, command.UserId);
        if (error != null)
        {
            return new Result<UserDto>(error);
        }

        user.UpdateUserRole(command.UserRole);

        _context.UserEntities.Update(user);
        await _context.SaveChangesAsync();

        var userDto = new UserDto(user.Id, user.Email, user.UserRole, user.UserStatus, user.WalletId, null);
        
        return new Result<UserDto>(userDto);
    }
}
