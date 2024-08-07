const Joi = require("joi");
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const schema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, required: false, default: false },
    createdAt: { type: Date, default: Date.now },
});

const Notes = mongoose.model("Note", schema);

router.get("/", async (req, res) => {
    let param = {};
    if (req.query.completed) {
        param["completed"] = req.query.completed;
    }
    const _notes = await Notes.find(param).select({ title: 1, description: 1, completed: 1, createdAt: 1 }).sort({ createdAt: 1 });
    res.send({
        "success": true,
        "data": _notes,
    });
});

router.get("/:id", async (req, res) => {
    try {
        const _id = req.params.id;
        if (mongoose.Types.ObjectId.isValid(_id)) {
            const _notes = await Notes.findById(req.params.id);
            if (_notes != null) {
                res.send({
                    "success": true,
                    "data": _notes,
                });
            } else {
                res.status(404).send({
                    "success": false,
                    "message": "No notes found with the given ID",
                });
            }
        } else {
            res.status(400).send({
                "success": false,
                "message": "Given id is invalid. Please Enter valid id!!",
            });
        }
    } catch (e) {
        res.status(400).send({
            "success": false,
            "message": e.message,
        });
    }
});

router.post("/", (req, res) => {
    console.log(req.body);
    const { error } = validateNotes(req.body);

    if (error && error.details[0].message) {
        res.status(400).send({
            "status": false,
            "message": error.details[0].message,
        });
    } else {
        const _notes = Notes(req.body);
        _notes.save();
        res.status(200).send({
            "status": true,
            "message": "Note saved successfully",
            "data": _notes,
        });
    }
});

router.post("/bulk", (req, res) => {
    console.log(req.body);
    const { error } = validateBulkNotes(req.body);

    if (error && error.details[0].message) {
        res.status(400).send({
            "status": false,
            "message": error.details[0].message,
        });
    } else {
        const newTodos = req.body.todo;
        const updatedTodo = [];
        for (var i = 0; i < newTodos.length; i++) {
            const _notes = Notes(newTodos[i]);
            _notes.save();
            updatedTodo.push(_notes)
        }
        res.status(200).send({
            "status": true,
            "message": "Note saved successfully",
            "data": updatedTodo,
        });
    }
});

router.post("/sync", async (req, res) => {
    console.log(req.body);
    const { error } = validateSyncNotes(req.body);

    if (error && error.details[0].message) {
        res.status(400).send({
            "status": false,
            "message": error.details[0].message,
        });
    } else {
        const newTodos = req.body.todo;
        const updatedTodo = [];
        for (var i = 0; i < newTodos.length; i++) {
            if (mongoose.Types.ObjectId.isValid(newTodos[i]._id)) {
                const exist = await Notes.findById(newTodos[i]._id);
                if (exist) {
                    const _notes = await Notes.findByIdAndUpdate(newTodos[i]._id, { $set: newTodos[i] }, { new: 1 }).select({ title: 1, description: 1, completed: 1, createdAt: 1 });
                    updatedTodo.push(_notes);
                    continue;
                }
            }
            const _notes = Notes({
                title: newTodos[i].title,
                description: newTodos[i].description
            });
            _notes.save();
            updatedTodo.push(_notes)
        }
        res.status(200).send({
            "status": true,
            "message": "Note saved successfully",
            "data": updatedTodo,
        });
    }
});

router.put("/:id", async (req, res) => {
    console.log(req.body);
    const _id = req.params.id;
    if (mongoose.Types.ObjectId.isValid(_id)) {

        const { error } = validateNotes(req.body);

        if (error && error.details[0].message) {
            res.status(400).send({
                "status": false,
                "message": error.details[0].message,
            });
        } else {
            const _notes = await Notes.findByIdAndUpdate(_id, { $set: req.body }, { new: 1 }).select({ title: 1, description: 1, completed: 1, createdAt: 1 });
            if (_notes != null) {
                res.status(200).send({
                    "status": true,
                    "message": "Note updated successfully",
                    "data": _notes,
                });
            } else {
                res.status(400).send({
                    "status": false,
                    "message": "No notes found with the given ID",
                });
            }
        }
    } else {
        res.status(400).send({
            "success": false,
            "message": "Given id is invalid. Please Enter valid id!!",
        });
    }
});

router.get("/:id/completed", async (req, res) => {
    const _id = req.params.id;
    if (mongoose.Types.ObjectId.isValid(_id)) {
        const _notes = await Notes.findByIdAndUpdate(_id, { completed: true }, { new: 1 }).select({ title: 1, description: 1, completed: 1, createdAt: 1 });
        if (_notes != null) {
            res.status(200).send({
                "status": true,
                "message": "Note completed successfully",
                "data": _notes,
            });
        } else {
            res.status(400).send({
                "status": false,
                "message": "No notes found with the given ID",
            });
        }
    } else {
        res.status(400).send({
            "success": false,
            "message": "Given id is invalid. Please Enter valid id!!",
        });
    }
});

router.delete("/:id", async (req, res) => {
    const _id = req.params.id;
    if (mongoose.Types.ObjectId.isValid(_id)) {
        const _notes = await Notes.findByIdAndDelete(_id);
        if (_notes != null) {
            res.status(200).send({
                "status": true,
                "message": "Note deleted successfully",
            });
        } else {
            res.status(400).send({
                "status": false,
                "message": "No notes found with the given ID",
            });
        }
    } else {
        res.status(400).send({
            "success": false,
            "message": "Given id is invalid. Please Enter valid id!!",
        });
    }
});


function validateNotes(item) {
    const validationSchema = Joi.object({
        title: Joi.string().required().min(3),
        description: Joi.string().required().max(255),
        completed: Joi.boolean(),
    });
    return validationSchema.validate(item);
}

function validateBulkNotes(item) {
    const validationSchema = Joi.object({
        todo: Joi.array().items(Joi.object({
            title: Joi.string().required().min(3),
            description: Joi.string().required().max(255),
            completed: Joi.boolean(),
        })).required()
    });
    return validationSchema.validate(item);
}

function validateSyncNotes(item) {
    const validationSchema = Joi.object({
        todo: Joi.array().items(Joi.object({
            _id: Joi.string().required(),
            title: Joi.string().required().min(3),
            description: Joi.string().required().max(255),
            completed: Joi.boolean(),
        })).required()
    });
    return validationSchema.validate(item);
}

module.exports = router;