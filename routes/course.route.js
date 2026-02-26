import { Router } from "express";
import { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, getMatchedCourses, findMatches } from "../controller/course.controller.js";
import authorize from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const courseRouter = Router();

courseRouter.post('/', authorize, upload.fields([
    { name: 'demovideo', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), createCourse);
courseRouter.get('/matches', authorize, getMatchedCourses);
courseRouter.get('/find-matches', authorize, findMatches);
courseRouter.get('/', getAllCourses);
courseRouter.get('/:id', getCourseById);
courseRouter.put('/:id', authorize, updateCourse);
courseRouter.delete('/:id', authorize, deleteCourse);

export default courseRouter;