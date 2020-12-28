//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

mongoose.connect("mongodb+srv://PandeyyyJi-Admin:Bookerly@cluster0.hakhk.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useFindAndModify", false);  //to prevent the deprecation warning

const itemsSchema = {
  name: String
};

// Item is the collection name.
const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);  //list model created

app.get("/", function(req, res) {
Item.find({}, function(err, foundItems){
  if(foundItems.length === 0) {
    Item.insertMany(defaultItems, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Default items added to the DB.");
      }
    });
   res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
  }

  // Item.find({}, function(err, foundItems){
  //   res.render("list", {listTitle: "Today", newListItems: foundItems});
});
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  // The list that the user tried to add the item into was from the default list
  // or any other custom list.
  if(listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.get("/:customListName", function(req, res){
   const customListName = _.capitalize(req.params.customListName);  //gives the name of the new directory created by user.

   List.findOne({name: customListName}, function(err, foundList){
     if(!err){
       if(!foundList){
         // Create a new list
         const list = new List({
           name: customListName,
           items: defaultItems
         });

         list.save();
         res.redirect("/" + customListName);

       } else {
        // show the existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
       }
     }
   });
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
//callback function necessary... method won't work without a callback function
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err) {
        console.log("Checked Item successfully deleted.");
        res.redirect("/");
      }
    });
  } else {
    //<ModelName>.findOneAndUpdate({conditions}, {updates}, callback function)
    //updates--> {$pull: {field: {_id: value}}};
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});

// app.get("/work", function(req,res){
//
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started Successfully");
});
