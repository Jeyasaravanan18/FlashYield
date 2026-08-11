import { ZodError } from "zod";
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        console.log("Validating body with keys:", schemas.body.shape ? Object.keys(schemas.body.shape) : "No shape");
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        console.error("Zod Validation Error:", JSON.stringify(err.errors, null, 2));
        console.error("Request Body:", req.body);
        res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: err.errors,
            schemaKeys: schemas.body && schemas.body.shape ? Object.keys(schemas.body.shape) : "Unknown"
          }
        });
        return;
      }
      next(err);
    }
  };
}
export {
  validate
};
