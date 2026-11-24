using FluxPayAPI.Consumer.BusinessLogic.Models;
using FluxPayAPI.Consumer.Domain.Constants;
using FluxPayAPI.Consumer.Persistence;
using FluxPayAPI.Shared.DTO.Abstractions;
using FluxPayAPI.Shared.DTO.Enums;
using FluxPayAPI.Shared.DTO.Responses;
using FluxPayAPI.Shared.DTO.Responses.Errors;
using Microsoft.EntityFrameworkCore;

namespace FluxPayAPI.Consumer.BusinessLogic.QueryHandlers;

internal static class UserListQuery
{
    public static async Task<IResult<List<UserDto>, Error>> ExecuteAsync(
        DatabaseContext context, string requesterId, int page, int requestedLimit, string emailPattern = null)
    {
        var requester = await context.UserEntities.FirstOrDefaultAsync(x => x.Id == requesterId);

        if (requester == null)
        {
            return new Result<List<UserDto>>(new DbEntityNotFoundError(ResponseMessages.RequesterNotFound));
        }

        if (requester.UserRole != UserRole.Admin)
        {
            return new Result<List<UserDto>>(new ConflictError(ResponseMessages.RequesterIsNotAdmin));
        }

        if (page < 1)
        {
            return new Result<List<UserDto>>(new BadRequestError(ResponseMessages.PageCannotBeLessThanOne));
        }

        var limit = requestedLimit < 1 ? DefaultValueConstants.DefaultLimit : requestedLimit;

        var query = context.UserEntities
            .Include(x => x.Wallet)
            .Where(x => x.Id != requester.Id && x.UserRole != UserRole.Admin);
        if (emailPattern is not null)
        {
            query = query.Where(x => EF.Functions.Like(x.Email, emailPattern));
        }

        var users = await query
            .Select(x => new UserDto(
                x.Id,
                x.Email,
                x.UserRole,
                x.UserStatus,
                x.WalletId,
                new WalletDto(
                    x.WalletId,
                    x.Wallet.Balance,
                    x.Wallet.LastTransactionId))
            )
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync();

        return new Result<List<UserDto>>(users);
    }
}
