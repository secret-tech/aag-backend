import User from '../user/model'
import Conversation  from './conversation.model'


export const listConversations = ({body, params, user}, res, next) => {
    User.findOne({ email: user.email })
        .populate({path: 'conversations', populate: { path: 'userOne' }})
        .populate({path: 'conversations', populate: { path: 'userTwo' }})
        .then((user) => {
            res.status(200).json({ conversations: user.conversations })
        });
}

export const createConversation = ({ body, params, user }, res, next) => {
    User.findOne({ email: user.email }).populate('conversations').then((user) => {
        const existingConversations = user.conversations.filter((conversation) => {
            return conversation.userOne.toString() === body.userId || conversation.userTwo.toString() === body.userId
        })
        if (existingConversations.length > 0) {
            const conv = existingConversations[0]
            Conversation.findById(conv._id).populate('userOne').populate('userTwo').then((conversation) => {
                res.status(200).json({conversation})
            })
        } else {
            User.findById(body.userId).then((friend) => {
                const newConversation = new Conversation({
                    userOne: user._id,
                    userTwo: friend._id,
                })
                newConversation.save().then((conversation) => {
                    user.conversations.push(conversation)
                    user.save()
                    friend.conversations.push(conversation)
                    friend.save()
                    conversation.userOne = user
                    conversation.userTwo = friend
                    res.status(200).json({ conversation })
                });
                },
            );
        }
    });

}