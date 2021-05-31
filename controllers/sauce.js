const Sauce = require('../models/sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const sauce = new Sauce({
    ...sauceObject,
    likes: 0,
    dislikes: 0,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistré !'}))
    .catch(error => res.status(400).json({ error }));
};

exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
  .then( sauce => res.status(200).json(sauce))
  .catch( error => res.status(404).json({ error: error }));
};

exports.modifySauce = (req, res, next) => {
    let sauceObject;

    if(req.file){
      Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {console.log("image supprimée")});
      })

      sauceObject = {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    } else {
      sauceObject = { ...req.body };
    }

    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Objet modifié !'}))
      .catch(error => res.status(400).json({ error }));
  };

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then( sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Sauce supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch( error => res.status(500).json({ error }));
};


exports.getAllStuff = (req, res, next) => {
  Sauce.find()
    .then( sauces => res.status(200).json(sauces))
    .catch( error => res.status(400).json({error: error }));
};

exports.like = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
  .then( sauce => {
    let operations = {};
     
    if(sauce.usersLiked.includes(req.body.userIdFromToken)){
      if(!req.body.like){ 
        operations["$pull"] = { usersLiked: req.body.userIdFromToken }
        operations["$inc"] = { likes: -1 }
      } else if (req.body.like == -1){
        operations["$pull"] = { usersLiked: req.body.userIdFromToken }
        operations["$push"] = { usersDisliked: req.body.userIdFromToken }
        operations["$inc"] = { likes: -1, dislikes: 1 }          
      }
    } else if (sauce.usersDisliked.includes(req.body.userIdFromToken)) {
      if(!req.body.like){
        operations["$pull"] = { usersDisliked: req.body.userIdFromToken }
        operations["$inc"] = { dislikes: -1 }
      } else if (req.body.like) {
        operations["$pull"] = { usersDisliked: req.body.userIdFromToken }
        operations["$push"] = { usersLiked: req.body.userIdFromToken }
        operations["$inc"] = { dislikes: -1, likes: 1 }
      }
    } else {
      if (req.body.like == -1) {
        operations["$push"] = { usersDisliked: req.body.userIdFromToken }
        operations["$inc"] = { dislikes: 1}
      } else if(req.body.like){
        operations["$push"] = { usersLiked: req.body.userIdFromToken }
        operations["$inc"] = { likes: 1 }
      }
    }

    Sauce.updateOne({ _id: req.params.id }, operations)
    .then( () => res.status(200).json({ message: 'like modifié !'}));
  });
};
