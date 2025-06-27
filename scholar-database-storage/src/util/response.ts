type BaseResponse = {
	success: boolean;
	msg: string;
	data?: any;
};

const baseResponse = (success: boolean, msg: string, data?: any): BaseResponse => {
	return {
		success: success,
		msg: msg,
		data: data || typeof data === 'boolean' ? data : null,
	};
};
const SuccessResponse = (msg: string, data?: any) => [baseResponse(true, msg, data), 200] as const;

const FailedResponse = (msg: string, status?: number) => {
	if (status) {
		return [baseResponse(false, msg), status as any] as const;
	}
	return [baseResponse(false, msg), 400] as const;
};

const ErrorResponse = (msg: any) => [baseResponse(false, `${msg}`), 500] as const;

export { SuccessResponse, FailedResponse, ErrorResponse };
