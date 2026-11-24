using FluxPayAPI.Consumer.Domain.Entities;
using FluxPayAPI.Consumer.Domain.Constants;
using FluxPayAPI.Consumer.Persistence;
using FluxPayAPI.Shared.DTO.Abstractions;
using FluxPayAPI.Shared.DTO.Enums;
using FluxPayAPI.Shared.DTO.Responses;
using FluxPayAPI.Shared.DTO.Responses.Errors;
using Microsoft.EntityFrameworkCore;

namespace FluxPayAPI.Consumer.BusinessLogic.CommandHandlers;

internal static class AdminUserLookup
{
    public static async Task<(UserEntity User, Error Error)> FindAsync(
        DatabaseContext context, string requesterId, string userId)
    {
        var requester = await context.UserEntities.FirstOrDefaultAsync(x => x.Id == requesterId);

        if (requester == null)
        {
            return (null, new DbEntityNotFoundError(ResponseMessages.RequesterNotFound));
        }

        if (requester.UserRole != UserRole.Admin)
        {
            return (null, new ConflictError(ResponseMessages.RequesterIsNotAdmin));
        }

        var user = await context.UserEntities.FirstOrDefaultAsync(x => x.Id == userId);

        if (user == null)
        {
            return (null, new DbEntityNotFoundError(ResponseMessages.UserNotFound));
        }

        return (user, null);
    }
}
